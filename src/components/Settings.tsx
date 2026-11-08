import { useEffect, useRef, useState } from "react";
import {
  Download,
  HardDrive,
  MonitorSmartphone,
  ShieldCheck,
  Upload,
  Undo2,
  WifiOff,
} from "lucide-react";
import { formatDate, parseBackup, type AppState } from "../domain/model";
import { repository } from "../data/repository";
import { Modal } from "./ui";

export function downloadFile(content: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
export default function Settings({
  state,
  onBackup,
  onRestore,
  onToast,
}: {
  state: AppState;
  onBackup: () => void;
  onRestore: (s: AppState) => Promise<boolean>;
  onToast: (t: string) => void;
}) {
  const [persistent, setPersistent] = useState<boolean | null>(null);
  const [bytes, setBytes] = useState<number | null>(null);
  const [incoming, setIncoming] = useState<AppState | null>(null);
  const [error, setError] = useState("");
  const [restoring, setRestoring] = useState(false);
  const [safety, setSafety] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    navigator.storage
      ?.persisted?.()
      .then(setPersistent)
      .catch(() => {});
    navigator.storage
      ?.estimate?.()
      .then((s) => setBytes(s.usage ?? null))
      .catch(() => {});
    repository
      .beforeImport()
      .then((s) => setSafety(!!s))
      .catch(() => {});
  }, []);
  async function requestPersistence() {
    try {
      const ok = await navigator.storage?.persist?.();
      setPersistent(!!ok);
      onToast(
        ok
          ? "Przeglądarka przyznała trwałą pamięć."
          : "Przeglądarka nie przyznała trwałej pamięci. Nadal korzystaj z kopii zapasowych.",
      );
    } catch {
      onToast("Ta przeglądarka nie udostępnia tej funkcji.");
    }
  }
  async function load(file?: File) {
    if (!file) return;
    setError("");
    try {
      if (file.size > 30_000_000)
        throw new Error("Maksymalny rozmiar kopii to 30 MB.");
      setIncoming(parseBackup(await file.text()));
    } catch (e) {
      setError(
        e instanceof Error && e.message.includes("MB")
          ? e.message
          : "Nie udało się wczytać kopii. Wybierz plik JSON wyeksportowany z Pilates Flow (wersja 1).",
      );
    }
    if (input.current) input.current.value = "";
  }
  function csv() {
    const cell = (s: string) =>
      `"${(/^[=+@\-\t\r\n]/.test(s) ? "'" : "") + s.replaceAll('"', '""')}"`;
    const rows = [
      [
        "Data",
        "Godzina",
        "Zajęcia",
        "Grupa",
        "Status",
        "Kolejność",
        "Ćwiczenie",
        "Minuty",
        "Notatka",
      ],
      ...state.sessions.flatMap((s) =>
        s.lines.map((l, i) => [
          s.date,
          s.time,
          s.title,
          s.groupName,
          {
            planned: "Zaplanowane",
            completed: "Odbyte",
            cancelled: "Odwołane",
          }[s.status],
          String(i + 1),
          l.exercise.name,
          String(l.minutes),
          l.note,
        ]),
      ),
    ];
    downloadFile(
      "\uFEFF" + rows.map((r) => r.map(cell).join(";")).join("\r\n"),
      "pilates-zajecia.csv",
      "text/csv;charset=utf-8",
    );
    onToast("Pobrano tabelę zajęć do Excela.");
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">TWOJA PRAKTYKA, TWOJE DANE</p>
          <h1>
            Spokojnie zapisane<span className="heading-dot">.</span>
          </h1>
          <p>Zadbaj o swoje plany i zabierz je na inne urządzenie.</p>
        </div>
      </div>
      <div className="settings-grid">
        <section className="settings-card">
          <span className="settings-icon">
            <HardDrive size={25} />
          </span>
          <h2>Kopie zapasowe</h2>
          <p>
            Plany, grupy, własne ćwiczenia i zdjęcia zapisują się w tej
            przeglądarce. Eksportuj kopię i zachowaj ją np. w Plikach lub na
            swoim dysku.
          </p>
          <div className="backup-status">
            <span className={`status-dot ${state.lastBackup ? "" : "amber"}`} />
            {state.lastBackup
              ? `Ostatni eksport: ${formatDate(state.lastBackup.slice(0, 10))}`
              : "Nie pobrano jeszcze kopii zapasowej"}
          </div>
          <button className="button full" onClick={onBackup}>
            <Download size={17} />
            Pobierz pełną kopię JSON
          </button>
          <button
            className="button secondary full"
            onClick={() => input.current?.click()}
          >
            <Upload size={17} />
            Wczytaj kopię z pliku
          </button>
          <input
            ref={input}
            hidden
            type="file"
            accept="application/json,.json"
            onChange={(e) => void load(e.target.files?.[0])}
          />
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {safety && (
            <button
              className="text-button"
              onClick={async () => {
                const s = await repository.beforeImport();
                if (s) setIncoming(s);
              }}
            >
              <Undo2 size={15} />
              Przywróć stan sprzed ostatniego importu
            </button>
          )}
        </section>
        <section className="settings-card">
          <span className="settings-icon peach">
            <ShieldCheck size={25} />
          </span>
          <h2>Pamięć na urządzeniu</h2>
          <p>
            {persistent
              ? "Ta przeglądarka przyznała trwałą pamięć aplikacji."
              : "Możesz poprosić przeglądarkę o ochronę danych przed automatycznym usunięciem przy braku miejsca."}
          </p>
          <p className="small muted">
            {bytes !== null
              ? `Zajęte miejsce: ${(bytes / 1024 / 1024).toFixed(1)} MB. `
              : ""}
            Wyczyszczenie danych witryny, utrata telefonu lub tryb prywatny mogą
            usunąć zapis. Trwała pamięć nie zastępuje kopii.
          </p>
          <button
            className="button secondary full"
            onClick={() => void requestPersistence()}
            disabled={persistent === true}
          >
            <ShieldCheck size={17} />
            {persistent ? "Trwała pamięć przyznana" : "Poproś o trwałą pamięć"}
          </button>
        </section>
        <section className="settings-card">
          <span className="settings-icon lavender">
            <MonitorSmartphone size={25} />
          </span>
          <h2>Na telefonie i komputerze</h2>
          <p>
            Po otwarciu aplikacji pod docelowym adresem dodaj ją do ekranu
            głównego telefonu. Na iPhonie użyj Udostępnij → Do ekranu
            początkowego. Na Androidzie wybierz Zainstaluj aplikację w menu
            przeglądarki.
          </p>
          <p className="small muted">
            Dane nie synchronizują się automatycznie między urządzeniami.
            Przenieś je przez eksport i import JSON. Zmiana domeny też wymaga
            przeniesienia kopii.
          </p>
        </section>
        <section className="settings-card">
          <span className="settings-icon">
            <WifiOff size={25} />
          </span>
          <h2>Gotowe na offline</h2>
          <p>
            Po pierwszym pełnym otwarciu wersji produkcyjnej biblioteka i planer
            są dostępne bez internetu. Własne zdjęcia również zostają na
            urządzeniu.
          </p>
          <button className="button secondary full" onClick={csv}>
            <Download size={17} />
            Eksportuj zajęcia do Excela (CSV)
          </button>
          <p className="small muted">
            CSV służy do przeglądania i drukowania tabeli. Pełną kopię do
            odtworzenia stanowi plik JSON.
          </p>
        </section>
      </div>
      {incoming && (
        <Modal
          title="Przywrócić tę kopię?"
          eyebrow="IMPORT DANYCH"
          onClose={() => setIncoming(null)}
        >
          <p>
            W pliku: <strong>{incoming.sessions.length} zajęć</strong>,{" "}
            <strong>{incoming.groups.length} grup</strong>,{" "}
            <strong>{incoming.customExercises.length} własnych ćwiczeń</strong>.
          </p>
          <p>
            Ta operacja zastąpi obecne dane. Przed zmianą zachowamy na
            urządzeniu kopię bezpieczeństwa. Możesz też teraz pobrać obecny
            stan.
          </p>
          <div className="button-row">
            <button className="button secondary" onClick={onBackup}>
              <Download size={16} />
              Pobierz obecne dane
            </button>
            <button
              className="button"
              disabled={restoring}
              onClick={async () => {
                setRestoring(true);
                if (await onRestore(incoming)) {
                  setIncoming(null);
                  setSafety(true);
                }
                setRestoring(false);
              }}
            >
              Przywróć dane z kopii
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
